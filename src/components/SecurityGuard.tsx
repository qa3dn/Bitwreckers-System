'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

interface SecurityGuardProps {
  children: React.ReactNode
  requiredRole?: 'team-lead' | 'project-manager' | 'member'
  requiredProjectId?: string
  requiredProjectRole?: 'project-manager' | 'member'
  fallback?: React.ReactNode
}

export default function SecurityGuard({
  children,
  requiredRole,
  requiredProjectId,
  requiredProjectRole,
  fallback
}: SecurityGuardProps) {
  const { user, userProfile, loading } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAccess = async () => {
      if (loading || !user || !userProfile) {
        setIsChecking(false)
        return
      }

      try {
        let access = true

        // Check role-based access
        if (requiredRole && userProfile.role !== requiredRole) {
          access = false
        }

        // Check project-based access
        if (requiredProjectId && requiredProjectRole) {
          const { data: projectMember } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', requiredProjectId)
            .eq('user_id', user.id)
            .single()

          if (!projectMember || projectMember.role !== requiredProjectRole) {
            access = false
          }
        }

        setHasAccess(access)
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [user, userProfile, loading, requiredRole, requiredProjectId, requiredProjectRole, supabase])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-purple" />
      </div>
    )
  }

  if (!hasAccess) {
    return fallback || (
      <div className="text-center py-12">
        <div className="bg-coral bg-opacity-20 border border-coral rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-coral mb-2">Access Denied</h2>
          <p className="text-light-gray mb-4">
            You don't have permission to access this resource.
          </p>
          {requiredRole && (
            <p className="text-sm text-light-gray">
              Required role: {requiredRole}
            </p>
          )}
          {requiredProjectRole && (
            <p className="text-sm text-light-gray">
              Required project role: {requiredProjectRole}
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook for checking permissions
export function usePermissions() {
  const { userProfile } = useAuth()
  const [permissions, setPermissions] = useState<{
    canCreateProjects: boolean
    canManageUsers: boolean
    canAssignTasks: boolean
    canViewAllProjects: boolean
    canViewAllTasks: boolean
  }>({
    canCreateProjects: false,
    canManageUsers: false,
    canAssignTasks: false,
    canViewAllProjects: false,
    canViewAllTasks: false
  })

  useEffect(() => {
    if (!userProfile) return

    const role = userProfile.role
    setPermissions({
      canCreateProjects: role === 'team-lead',
      canManageUsers: role === 'team-lead',
      canAssignTasks: role === 'team-lead' || role === 'project-manager',
      canViewAllProjects: role === 'team-lead' || role === 'project-manager',
      canViewAllTasks: role === 'team-lead' || role === 'project-manager'
    })
  }, [userProfile])

  return permissions
}

// Hook for checking project permissions
export function useProjectPermissions(projectId: string) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<{
    canManageProject: boolean
    canAssignTasks: boolean
    canViewProject: boolean
    isProjectManager: boolean
    isProjectMember: boolean
  }>({
    canManageProject: false,
    canAssignTasks: false,
    canViewProject: false,
    isProjectManager: false,
    isProjectMember: false
  })
  const [isChecking, setIsChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkProjectPermissions = async () => {
      if (!user || !projectId) {
        setIsChecking(false)
        return
      }

      try {
        const { data: projectMember } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single()

        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const isProjectManager = projectMember?.role === 'project-manager'
        const isProjectMember = !!projectMember
        const isTeamLead = userProfile?.role === 'team-lead'

        setPermissions({
          canManageProject: isTeamLead || isProjectManager,
          canAssignTasks: isTeamLead || isProjectManager,
          canViewProject: isTeamLead || isProjectMember,
          isProjectManager,
          isProjectMember
        })
      } catch (error) {
        console.error('Error checking project permissions:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkProjectPermissions()
  }, [user, projectId, supabase])

  return { permissions, isChecking }
}

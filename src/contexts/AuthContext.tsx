'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User as DatabaseUser } from '@/types/database'

interface AuthContextType {
  user: User | null
  userProfile: DatabaseUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<DatabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    // Set a timeout to stop loading after 5 seconds
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('AuthContext: Timeout reached, stopping loading')
        setLoading(false)
      }
    }, 5000)

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error getting user:', error)
          if (isMounted) {
            setUser(null)
            setUserProfile(null)
            setLoading(false)
          }
          return
        }
        if (isMounted) {
          setUser(user)
          if (!user) {
            setUserProfile(null)
            setLoading(false)
            return
          }
        }
        
        if (user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (profileError) {
              console.error('Error getting user profile:', profileError)
              // If profile doesn't exist, create it
              if (profileError.code === 'PGRST116') {
                const { data: newProfile, error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: user.id,
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    email: user.email || '',
                    role: 'member',
                    department: 'general',
                    member_id: 'GEN-0001'
                  })
                  .select()
                  .single()
                
                if (createError) {
                  console.error('Error creating user profile:', createError)
                } else if (isMounted) {
                  setUserProfile(newProfile)
                }
              }
            } else if (isMounted) {
              setUserProfile(profile)
            }
          } catch (error) {
            console.error('Error getting user profile:', error)
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        console.log('AuthContext: Setting loading to false')
        if (isMounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profileError) {
              console.error('Error getting user profile:', profileError)
              // If profile doesn't exist, create it
              if (profileError.code === 'PGRST116') {
                const { data: newProfile, error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                    email: session.user.email || '',
                    role: 'member',
                    department: 'general',
                    member_id: 'GEN-0001'
                  })
                  .select()
                  .single()
                
                if (createError) {
                  console.error('Error creating user profile:', createError)
                } else if (isMounted) {
                  setUserProfile(newProfile)
                }
              }
            } else if (isMounted) {
              setUserProfile(profile)
            }
          } catch (error) {
            console.error('Error getting user profile:', error)
          }
        } else if (isMounted) {
          setUserProfile(null)
        }
        
        if (isMounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    userProfile,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

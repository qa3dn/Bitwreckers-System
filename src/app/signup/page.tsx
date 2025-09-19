'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { EyeIcon, EyeSlashIcon, UserIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    memberId: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [memberIdStatus, setMemberIdStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [memberIdInfo, setMemberIdInfo] = useState<{department: string, role: string} | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const validateMemberId = async (memberId: string) => {
    if (!memberId.trim()) {
      setMemberIdStatus('idle')
      setMemberIdInfo(null)
      return
    }

    setMemberIdStatus('checking')
    
    try {
      // Check if member ID exists and is not assigned
      const { data: memberData, error } = await supabase
        .from('member_ids')
        .select('*')
        .eq('member_id', memberId)
        .eq('assigned', false)
        .single()

      if (error || !memberData) {
        setMemberIdStatus('invalid')
        setMemberIdInfo(null)
        return
      }

      // Extract department and role from member ID manually
      let department = 'General'
      const role = 'member'
      
      if (memberId.startsWith('PR-')) {
        department = 'PR'
      } else if (memberId.startsWith('MED-')) {
        department = 'Media'
      } else if (memberId.startsWith('DEV-')) {
        department = 'Dev'
      } else if (memberId.startsWith('MGT-')) {
        department = 'Management'
      } else if (memberId.startsWith('GEN-')) {
        department = 'General'
      } else {
        setMemberIdStatus('invalid')
        setMemberIdInfo(null)
        return
      }

      setMemberIdStatus('valid')
      setMemberIdInfo({
        department: department,
        role: role
      })
    } catch (error) {
      setMemberIdStatus('invalid')
      setMemberIdInfo(null)
    }
  }

  const handleMemberIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase()
    
    // Format: PR-1234, MED-1234, DEV-1234, MGT-1234, GEN-1234
    if (value.length > 3 && !value.includes('-')) {
      const prefix = value.substring(0, 3)
      const numbers = value.substring(3).replace(/\D/g, '').substring(0, 4)
      value = `${prefix}-${numbers}`
    }
    
    setFormData({ ...formData, memberId: value })
    
    // Debounce validation
    setTimeout(() => {
      validateMemberId(value)
    }, 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (memberIdStatus !== 'valid') {
      setError('Invalid member ID or already in use')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile with department and role
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name: formData.name,
            email: formData.email,
            role: memberIdInfo?.role || 'member',
            department: memberIdInfo?.department || 'General',
            member_id: formData.memberId
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError(`Profile creation failed: ${profileError.message}`)
          setLoading(false)
          return
        }

        // Mark member ID as assigned
        const { error: updateError } = await supabase
          .from('member_ids')
          .update({ 
            assigned: true, 
            assigned_to: data.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('member_id', formData.memberId)

        if (updateError) {
          console.error('Member ID update error:', updateError)
        }

        router.push('/login?message=Account created successfully! Please check your email to verify your account.')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getDepartmentLabel = (dept: string) => {
    const departments: {[key: string]: string} = {
      'PR': 'Public Relations',
      'Media': 'Media',
      'Dev': 'Development',
      'Management': 'Management',
      'General': 'General Member'
    }
    return departments[dept] || dept
  }

  return (
    <div className="min-h-screen bg-midnight-blue flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-electric-purple mb-2">
            Bitwreckers System
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-soft-white">
            Create New Account
          </h2>
          <p className="mt-2 text-center text-sm text-light-gray">
            Or{' '}
            <Link href="/login" className="font-medium text-electric-purple hover:text-purple-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="memberId" className="block text-sm font-medium text-light-gray">
                Member ID *
              </label>
              <div className="mt-1 relative">
                <input
                  id="memberId"
                  name="memberId"
                  type="text"
                  required
                  value={formData.memberId}
                  onChange={handleMemberIdChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 placeholder-gray-400 text-soft-white bg-dark-gray rounded-md focus:outline-none focus:ring-electric-purple focus:border-electric-purple focus:z-10 sm:text-sm font-mono"
                  placeholder="PR-1234, MED-5678, DEV-9012"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {memberIdStatus === 'checking' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-electric-purple" />
                  )}
                  {memberIdStatus === 'valid' && (
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  )}
                  {memberIdStatus === 'invalid' && (
                    <XMarkIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              {memberIdStatus === 'valid' && memberIdInfo && (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm text-green-400">
                    ✓ Valid Member ID - {getDepartmentLabel(memberIdInfo.department)}
                  </p>
                </div>
              )}
              {memberIdStatus === 'invalid' && (
                <p className="mt-2 text-sm text-red-400">
                  Invalid Member ID or already in use
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-light-gray">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-soft-white bg-dark-gray rounded-md focus:outline-none focus:ring-electric-purple focus:border-electric-purple focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light-gray">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-soft-white bg-dark-gray rounded-md focus:outline-none focus:ring-electric-purple focus:border-electric-purple focus:z-10 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-light-gray">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 placeholder-gray-400 text-soft-white bg-dark-gray rounded-md focus:outline-none focus:ring-electric-purple focus:border-electric-purple focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-gray">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-600 placeholder-gray-400 text-soft-white bg-dark-gray rounded-md focus:outline-none focus:ring-electric-purple focus:border-electric-purple focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || memberIdStatus !== 'valid'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-soft-white bg-electric-purple hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
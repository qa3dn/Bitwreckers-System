'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { 
  UserIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  PhotoIcon,
  LinkIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  full_name: string
  bio: string
  department: string
  specialization: string
  study_field: string
  team: string
  projects_count: number
  social_links: {
    linkedin?: string
    twitter?: string
    instagram?: string
    github?: string
    website?: string
  }
  avatar_url: string
  created_at: string
  updated_at: string
}

const departments = [
  { value: 'pr', label: 'Public Relations' },
  { value: 'media', label: 'Media' },
  { value: 'dev', label: 'Development' },
  { value: 'management', label: 'Management' },
  { value: 'general', label: 'General Member' }
]

const specializations = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'UI/UX Design',
  'Video Editing',
  'Graphic Design',
  'Content Writing',
  'Social Media Management',
  'Project Management',
  'Marketing',
  'Sales',
  'Other'
]

export default function ProfilePage() {
  const { userProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    department: '',
    specialization: '',
    study_field: '',
    team: '',
    social_links: {
      linkedin: '',
      twitter: '',
      instagram: '',
      github: '',
      website: ''
    },
    avatar_url: ''
  })
  const supabase = createClient()

  const fetchProfile = async () => {
    if (!userProfile?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userProfile.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          department: data.department || '',
          specialization: data.specialization || '',
          study_field: data.study_field || '',
          team: data.team || '',
          social_links: data.social_links || {
            linkedin: '',
            twitter: '',
            instagram: '',
            github: '',
            website: ''
          },
          avatar_url: data.avatar_url || ''
        })
      } else {
        // Create initial profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userProfile.id,
            full_name: userProfile.name || '',
            department: userProfile.department || 'general',
            projects_count: 0
          })
          .select()
          .single()

        if (createError) throw createError

        setProfile(newProfile)
        setFormData({
          full_name: newProfile.full_name || '',
          bio: newProfile.bio || '',
          department: newProfile.department || '',
          specialization: newProfile.specialization || '',
          study_field: newProfile.study_field || '',
          team: newProfile.team || '',
          social_links: newProfile.social_links || {
            linkedin: '',
            twitter: '',
            instagram: '',
            github: '',
            website: ''
          },
          avatar_url: newProfile.avatar_url || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userProfile?.id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)

      if (error) throw error

      // Update user name in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ name: formData.full_name })
        .eq('id', userProfile.id)

      if (userError) console.error('Error updating user name:', userError)

      setProfile(prev => prev ? { ...prev, ...formData } : null)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        department: profile.department || '',
        specialization: profile.specialization || '',
        study_field: profile.study_field || '',
        team: profile.team || '',
        social_links: profile.social_links || {
          linkedin: '',
          twitter: '',
          instagram: '',
          github: '',
          website: ''
        },
        avatar_url: profile.avatar_url || ''
      })
    }
    setIsEditing(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith('social_links.')) {
      const socialKey = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialKey]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const getDepartmentLabel = (dept: string) => {
    return departments.find(d => d.value === dept)?.label || dept
  }

  useEffect(() => {
    fetchProfile()
  }, [userProfile?.id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-purple" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-midnight-blue p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-soft-white">Personal Profile</h1>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-electric-purple text-soft-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500 text-soft-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-50"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 text-soft-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-dark-gray rounded-lg p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-electric-purple flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="h-16 w-16 text-soft-white" />
                      </div>
                    )}
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 bg-electric-purple text-soft-white p-2 rounded-full hover:bg-purple-600 transition-colors">
                        <PhotoIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="text-2xl font-bold text-soft-white bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 w-full text-center"
                      placeholder="Full Name"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-soft-white mb-2">
                      {profile?.full_name || 'No Name'}
                    </h2>
                  )}

                  <p className="text-light-gray mb-4">
                    {getDepartmentLabel(profile?.department || 'general')}
                  </p>

                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white text-center resize-none"
                      rows={3}
                      placeholder="Write about yourself..."
                    />
                  ) : (
                    <p className="text-light-gray text-sm">
                      {profile?.bio || 'No bio added yet'}
                    </p>
                  )}
                </div>

                {/* Social Links */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Social Links</h3>
                  <div className="space-y-3">
                    {Object.entries(formData.social_links).map(([platform, url]) => (
                      <div key={platform} className="flex items-center">
                        <LinkIcon className="h-5 w-5 text-light-gray mr-3" />
                        {isEditing ? (
                          <input
                            type="url"
                            name={`social_links.${platform}`}
                            value={url}
                            onChange={handleChange}
                            className="flex-1 bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white text-sm"
                            placeholder={`${platform} URL`}
                          />
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-electric-purple hover:text-purple-400 text-sm truncate"
                          >
                            {url || `Add ${platform}`}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              <div className="bg-dark-gray rounded-lg p-6">
                <h3 className="text-xl font-bold text-soft-white mb-6">Personal Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <BriefcaseIcon className="h-5 w-5 inline mr-2" />
                      Department
                    </label>
                    {isEditing ? (
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white"
                      >
                        {departments.map((dept) => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-soft-white">{getDepartmentLabel(profile?.department || 'general')}</p>
                    )}
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <UserIcon className="h-5 w-5 inline mr-2" />
                      Specialization
                    </label>
                    {isEditing ? (
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white"
                      >
                        <option value="">Select Specialization</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-soft-white">{profile?.specialization || 'No specialization selected'}</p>
                    )}
                  </div>

                  {/* Study Field */}
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <AcademicCapIcon className="h-5 w-5 inline mr-2" />
                      Study Field
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="study_field"
                        value={formData.study_field}
                        onChange={handleChange}
                        className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white"
                        placeholder="e.g. Computer Science, Marketing..."
                      />
                    ) : (
                      <p className="text-soft-white">{profile?.study_field || 'No study field specified'}</p>
                    )}
                  </div>

                  {/* Team */}
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <UsersIcon className="h-5 w-5 inline mr-2" />
                      Team
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="team"
                        value={formData.team}
                        onChange={handleChange}
                        className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white"
                        placeholder="Team or Group Name"
                      />
                    ) : (
                      <p className="text-soft-white">{profile?.team || 'No team specified'}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="text-lg font-semibold text-soft-white mb-4">Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-midnight-blue p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-electric-purple">
                        {profile?.projects_count || 0}
                      </div>
                      <div className="text-sm text-light-gray">Projects</div>
                    </div>
                    <div className="bg-midnight-blue p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                      </div>
                      <div className="text-sm text-light-gray">Days on Platform</div>
                    </div>
                    <div className="bg-midnight-blue p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {profile?.member_id || 'N/A'}
                      </div>
                      <div className="text-sm text-light-gray">Member ID</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

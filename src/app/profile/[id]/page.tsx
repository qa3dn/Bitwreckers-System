'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { 
  UserIcon, 
  LinkIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UsersIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

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
  user?: {
    name: string
    email: string
    member_id: string
  }
}

const departments = [
  { value: 'pr', label: 'العلاقات العامة' },
  { value: 'media', label: 'الميديا' },
  { value: 'dev', label: 'البرمجة' },
  { value: 'management', label: 'الإدارة' },
  { value: 'general', label: 'عضو عادي' }
]

const socialIcons = {
  linkedin: '🔗',
  twitter: '🐦',
  instagram: '📷',
  github: '💻',
  website: '🌐'
}

export default function UserProfilePage() {
  const { id } = useParams()
  const { userProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  const fetchProfile = async () => {
    if (!id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user:users!profiles_id_fkey(name, email, member_id)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('البروفايل غير موجود')
        } else {
          throw error
        }
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('خطأ في تحميل البروفايل')
    } finally {
      setLoading(false)
    }
  }

  const getDepartmentLabel = (dept: string) => {
    return departments.find(d => d.value === dept)?.label || dept
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysSinceJoined = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  useEffect(() => {
    fetchProfile()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-purple" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="text-center">
            <UserIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-soft-white mb-2">البروفايل غير موجود</h2>
            <p className="text-light-gray mb-4">{error}</p>
            <Link
              href="/profile"
              className="bg-electric-purple text-soft-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              العودة للبروفايل الشخصي
            </Link>
          </div>
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
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/profile"
                className="p-2 text-light-gray hover:text-soft-white transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-soft-white">بروفايل العضو</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-dark-gray rounded-lg p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-electric-purple flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="h-16 w-16 text-soft-white" />
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-soft-white mb-2">
                    {profile.full_name || profile.user?.name || 'بدون اسم'}
                  </h2>

                  <p className="text-light-gray mb-2">
                    {getDepartmentLabel(profile.department || 'general')}
                  </p>

                  {profile.specialization && (
                    <p className="text-electric-purple text-sm mb-4">
                      {profile.specialization}
                    </p>
                  )}

                  {profile.bio && (
                    <p className="text-light-gray text-sm mb-4">
                      {profile.bio}
                    </p>
                  )}

                  {/* Contact Button */}
                  <Link
                    href={`/chat?direct=${profile.id}`}
                    className="bg-electric-purple text-soft-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center w-full"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    إرسال رسالة
                  </Link>
                </div>

                {/* Social Links */}
                {Object.values(profile.social_links).some(link => link) && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-soft-white mb-4">روابط التواصل</h3>
                    <div className="space-y-3">
                      {Object.entries(profile.social_links).map(([platform, url]) => (
                        url && (
                          <div key={platform} className="flex items-center">
                            <span className="text-2xl mr-3">{socialIcons[platform as keyof typeof socialIcons]}</span>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-electric-purple hover:text-purple-400 text-sm truncate"
                            >
                              {url}
                            </a>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              <div className="bg-dark-gray rounded-lg p-6">
                <h3 className="text-xl font-bold text-soft-white mb-6">التفاصيل الشخصية</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <BriefcaseIcon className="h-5 w-5 inline mr-2" />
                      القسم
                    </label>
                    <p className="text-soft-white">{getDepartmentLabel(profile.department || 'general')}</p>
                  </div>

                  {/* Specialization */}
                  {profile.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-light-gray mb-2">
                        <UserIcon className="h-5 w-5 inline mr-2" />
                        التخصص
                      </label>
                      <p className="text-soft-white">{profile.specialization}</p>
                    </div>
                  )}

                  {/* Study Field */}
                  {profile.study_field && (
                    <div>
                      <label className="block text-sm font-medium text-light-gray mb-2">
                        <AcademicCapIcon className="h-5 w-5 inline mr-2" />
                        مجال الدراسة
                      </label>
                      <p className="text-soft-white">{profile.study_field}</p>
                    </div>
                  )}

                  {/* Team */}
                  {profile.team && (
                    <div>
                      <label className="block text-sm font-medium text-light-gray mb-2">
                        <UsersIcon className="h-5 w-5 inline mr-2" />
                        الفريق
                      </label>
                      <p className="text-soft-white">{profile.team}</p>
                    </div>
                  )}

                  {/* Member ID */}
                  {profile.user?.member_id && (
                    <div>
                      <label className="block text-sm font-medium text-light-gray mb-2">
                        <UserIcon className="h-5 w-5 inline mr-2" />
                        رقم العضوية
                      </label>
                      <p className="text-soft-white font-mono">{profile.user.member_id}</p>
                    </div>
                  )}

                  {/* Join Date */}
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-2">
                      <CalendarIcon className="h-5 w-5 inline mr-2" />
                      تاريخ الانضمام
                    </label>
                    <p className="text-soft-white">{formatDate(profile.created_at)}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="text-lg font-semibold text-soft-white mb-4">الإحصائيات</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-midnight-blue p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-electric-purple">
                        {profile.projects_count || 0}
                      </div>
                      <div className="text-sm text-light-gray">المشاريع</div>
                    </div>
                    <div className="bg-midnight-blue p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {getDaysSinceJoined(profile.created_at)}
                      </div>
                      <div className="text-sm text-light-gray">أيام في المنصة</div>
                    </div>
                    <div className="bg-midnight-blue p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {profile.user?.member_id ? 'عضو' : 'زائر'}
                      </div>
                      <div className="text-sm text-light-gray">الحالة</div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="text-lg font-semibold text-soft-white mb-4">النشاط الأخير</h4>
                  <div className="space-y-3">
                    <div className="bg-midnight-blue p-4 rounded-lg">
                      <p className="text-sm text-light-gray">
                        انضم للفريق منذ {getDaysSinceJoined(profile.created_at)} يوم
                      </p>
                    </div>
                    {profile.projects_count > 0 && (
                      <div className="bg-midnight-blue p-4 rounded-lg">
                        <p className="text-sm text-light-gray">
                          شارك في {profile.projects_count} مشروع
                        </p>
                      </div>
                    )}
                    <div className="bg-midnight-blue p-4 rounded-lg">
                      <p className="text-sm text-light-gray">
                        آخر تحديث للبروفايل: {formatDate(profile.updated_at)}
                      </p>
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

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface MemberId {
  id: string
  member_id: string
  department: string
  role: string
  assigned: boolean
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  user?: {
    name: string
    email: string
  }
}

const departments = [
  { value: 'pr', label: 'العلاقات العامة (PR)', prefix: 'PR' },
  { value: 'media', label: 'الميديا (Media)', prefix: 'MEDIA' },
  { value: 'dev', label: 'البرمجة (Development)', prefix: 'DEV' },
  { value: 'management', label: 'الإدارة (Management)', prefix: 'MNG' },
  { value: 'general', label: 'عضو عادي (General)', prefix: 'GEN' }
]

export default function MemberManagementPage() {
  const { userProfile } = useAuth()
  const [memberIds, setMemberIds] = useState<MemberId[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState('pr')
  const [quantity, setQuantity] = useState(1)
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const fetchMemberIds = async () => {
    try {
      // Check if table exists first
      const { data: tableCheck, error: tableError } = await supabase
        .from('member_ids')
        .select('id')
        .limit(1)

      if (tableError && tableError.code === '42P01') {
        console.log('Table member_ids does not exist, creating sample data...')
        setMemberIds([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('member_ids')
        .select(`
          *,
          user:users!member_ids_assigned_to_fkey(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMemberIds(data || [])
    } catch (error) {
      console.error('Error fetching member IDs:', error)
      setMemberIds([])
    } finally {
      setLoading(false)
    }
  }

  const generateMemberIds = async () => {
    try {
      console.log('Starting to generate member IDs...')
      console.log('Selected department:', selectedDepartment)
      console.log('Quantity:', quantity)
      console.log('User profile:', userProfile)

      // Generate multiple member IDs based on quantity
      for (let i = 0; i < quantity; i++) {
        console.log(`Generating member ID ${i + 1}/${quantity}`)
        
        // Generate random 4-digit number
        const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const prefix = departments.find(d => d.value === selectedDepartment)?.prefix || 'GEN'
        const memberId = `${prefix}-${randomDigits}`
        
        console.log('Generated member ID:', memberId)

        // Check if this ID already exists
        const { data: existing, error: checkError } = await supabase
          .from('member_ids')
          .select('id')
          .eq('member_id', memberId)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing member ID:', checkError)
          throw checkError
        }

        if (existing) {
          console.log('Member ID already exists, generating new one...')
          i-- // Try again
          continue
        }

        // Create the member ID record
        const { error: insertError } = await supabase
          .from('member_ids')
          .insert({
            member_id: memberId,
            department: selectedDepartment,
            role: `${selectedDepartment}_member`,
            created_by: userProfile?.id
          })

        if (insertError) {
          console.error('Error inserting member ID:', insertError)
          throw insertError
        }

        console.log('Successfully created member ID:', memberId)
      }

      setShowAddModal(false)
      setQuantity(1)
      fetchMemberIds()
      alert(`Successfully created ${quantity} member ID(s)!`)
    } catch (error) {
      console.error('Error generating member ID:', error)
      alert(`Error creating member ID: ${error.message || error}`)
    }
  }

  const deleteMemberId = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member ID?')) return

    try {
      const { error } = await supabase
        .from('member_ids')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchMemberIds()
    } catch (error) {
      console.error('Error deleting member ID:', error)
      alert('Error deleting member ID')
    }
  }

  const getDepartmentLabel = (dept: string) => {
    return departments.find(d => d.value === dept)?.label || dept
  }

  const getStatusColor = (assigned: boolean) => {
    return assigned ? 'text-green-500' : 'text-yellow-500'
  }

  const getStatusText = (assigned: boolean) => {
    return assigned ? 'Assigned' : 'Unassigned'
  }

  const filteredMemberIds = memberIds.filter(member => {
    const matchesFilter = filter === 'all' || 
      (filter === 'assigned' && member.assigned) || 
      (filter === 'unassigned' && !member.assigned)
    
    const matchesSearch = member.member_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  useEffect(() => {
    fetchMemberIds()
  }, [])

  // Check if user has permission (team-lead only)
  if (userProfile?.role !== 'team-lead') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="text-center">
            <XMarkIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-soft-white mb-2">غير مصرح لك</h2>
            <p className="text-light-gray">هذه الصفحة متاحة فقط لرؤساء الفريق</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-soft-white mb-2">Member ID Management</h1>
            <p className="text-light-gray">Manage and create member IDs for new members</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-electric-purple" />
                <div className="ml-4">
                  <p className="text-sm text-light-gray">Total IDs</p>
                  <p className="text-2xl font-bold text-soft-white">{memberIds.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <CheckIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm text-light-gray">Assigned</p>
                  <p className="text-2xl font-bold text-soft-white">
                    {memberIds.filter(m => m.assigned).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <XMarkIcon className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm text-light-gray">Unassigned</p>
                  <p className="text-2xl font-bold text-soft-white">
                    {memberIds.filter(m => !m.assigned).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm text-light-gray">This Month</p>
                  <p className="text-2xl font-bold text-soft-white">
                    {memberIds.filter(m => {
                      const created = new Date(m.created_at)
                      const now = new Date()
                      return created.getMonth() === now.getMonth() && 
                             created.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-dark-gray p-6 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-electric-purple text-soft-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add New Member ID
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search member IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                />
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                >
                  <option value="all">All IDs</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Member IDs Table */}
          <div className="bg-dark-gray rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-midnight-blue">
                  <tr>
                    <th className="px-6 py-4 text-left text-soft-white font-semibold">Member ID</th>
                    <th className="px-6 py-4 text-left text-soft-white font-semibold">Department</th>
                    <th className="px-6 py-4 text-left text-soft-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-soft-white font-semibold">User</th>
                    <th className="px-6 py-4 text-left text-soft-white font-semibold">Created Date</th>
                    <th className="px-6 py-4 text-left text-soft-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberIds.map((member) => (
                    <tr key={member.id} className="border-t border-gray-700 hover:bg-midnight-blue">
                      <td className="px-6 py-4 text-soft-white font-mono">{member.member_id}</td>
                      <td className="px-6 py-4 text-light-gray">{getDepartmentLabel(member.department)}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${getStatusColor(member.assigned)}`}>
                          {getStatusText(member.assigned)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-light-gray">
                        {member.user ? (
                          <div>
                            <div className="font-semibold text-soft-white">{member.user.name}</div>
                            <div className="text-sm">{member.user.email}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-light-gray">
                        {new Date(member.created_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {!member.assigned && (
                            <button
                              onClick={() => deleteMemberId(member.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-gray p-6 rounded-lg w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-soft-white mb-4">Add New Member ID</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                  >
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                  />
                </div>

                <div className="bg-midnight-blue p-4 rounded-lg">
                  <p className="text-sm text-light-gray mb-2">Preview:</p>
                  <p className="font-mono text-electric-purple">
                    {departments.find(d => d.value === selectedDepartment)?.prefix}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={generateMemberIds}
                  className="flex-1 bg-electric-purple text-soft-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-600 text-soft-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

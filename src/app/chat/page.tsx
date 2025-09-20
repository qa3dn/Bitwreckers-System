'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TypingIndicator from '@/components/TypingIndicator'
import ReadReceipt from '@/components/ReadReceipt'
import PinnedMessage from '@/components/PinnedMessage'
import FileUpload from '@/components/FileUpload'
import MessageSearch from '@/components/MessageSearch'
import { createClient } from '@/lib/supabase/client'
import { User, Project, Message } from '@/types/database'
import { 
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
  UserIcon,
  FolderIcon,
  PlusIcon,
  ArrowUpIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  FaceSmileIcon,
  PhotoIcon,
  DocumentIcon,
  MicrophoneIcon,
  CheckIcon,
  ClockIcon,
  StarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { useAppKeyboardShortcuts, useChatKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

type ChatMode = 'company' | 'project' | 'direct'
type SearchResult = {
  message: Message
  sender: User
  project?: Project
}

export default function ChatPage() {
  const { user } = useAuth()
  const [chatMode, setChatMode] = useState<ChatMode>('company')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [typingUsers, setTypingUsers] = useState<User[]>([])
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Keyboard shortcuts
  useAppKeyboardShortcuts()
  useChatKeyboardShortcuts(
    () => handleSendMessage(),
    () => inputRef.current?.focus()
  )

  useEffect(() => {
    if (user) {
      fetchInitialData()
      requestNotificationPermission()
    }
  }, [user])

  // Update unread count when messages change
  useEffect(() => {
    updateUnreadCount()
  }, [messages, lastReadMessageId])

  // Mark as read when user is viewing chat
  useEffect(() => {
    markAsRead()
  }, [messages])

  useEffect(() => {
    if (chatMode && (selectedProject || selectedUser || chatMode === 'company')) {
      fetchMessages()
    }
  }, [chatMode, selectedProject, selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Realtime subscription for messages
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message received:', payload)
          const newMessage = payload.new as Message
          
          // Check if message should be shown in current chat mode
          let shouldShow = false
          
          if (chatMode === 'company') {
            shouldShow = !newMessage.project_id && !newMessage.receiver_id
          } else if (chatMode === 'project' && selectedProject) {
            shouldShow = newMessage.project_id === selectedProject.id && !newMessage.receiver_id
          } else if (chatMode === 'direct' && selectedUser) {
            shouldShow = (newMessage.sender_id === user.id && newMessage.receiver_id === selectedUser.id) ||
                        (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === user.id)
          }
          
          if (shouldShow) {
            // Fetch the full message with relations
            supabase
              .from('messages')
              .select(`
                *,
                sender:users!messages_sender_id_fkey(*),
                receiver:users!messages_receiver_id_fkey(*),
                project:projects!messages_project_id_fkey(*)
              `)
              .eq('id', newMessage.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    const exists = prev.some(msg => msg.id === data.id)
                    if (exists) return prev
                    
                    // Show notification for new messages from others
                    if (data.sender_id !== user?.id && data.sender) {
                      showNotification(data, data.sender)
                    }
                    
                    return [...prev, data]
                  })
                }
              })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, chatMode, selectedProject, selectedUser])

  const fetchInitialData = async () => {
    try {
      const [usersResult, projectsResult] = await Promise.all([
        supabase.from('users').select('*').order('name'),
        supabase.from('projects').select('*').order('name')
      ])

      setUsers(usersResult.data || [])
      setProjects(projectsResult.data || [])
      
      // Simulate online users
      setOnlineUsers(usersResult.data?.slice(0, 3).map(u => u.id) || [])
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(*),
          receiver:users!messages_receiver_id_fkey(*),
          project:projects!messages_project_id_fkey(*)
        `)
        .order('created_at', { ascending: true })

      if (chatMode === 'company') {
        query = query.is('project_id', null).is('receiver_id', null)
      } else if (chatMode === 'project' && selectedProject) {
        query = query.eq('project_id', selectedProject.id).is('receiver_id', null)
      } else if (chatMode === 'direct' && selectedUser) {
        query = query.or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user?.id})`)
      }

      const { data: messagesData } = await query
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return

    try {
      const messageData: any = {
        sender_id: user?.id,
        content: newMessage.trim(),
        message_type: selectedFile ? 'file' : 'text'
      }

      if (chatMode === 'project' && selectedProject) {
        messageData.project_id = selectedProject.id
      } else if (chatMode === 'direct' && selectedUser) {
        messageData.receiver_id = selectedUser.id
      }

      if (selectedFile) {
        messageData.file_url = URL.createObjectURL(selectedFile)
      }

      console.log('Sending message:', messageData) // Debug log

      const { data: newMessageData, error: insertError } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:users!messages_sender_id_fkey(*),
          receiver:users!messages_receiver_id_fkey(*),
          project:projects!messages_project_id_fkey(*)
        `)
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        alert(`Error sending message: ${insertError.message}`)
        return
      }

      if (newMessageData) {
        console.log('Message sent successfully:', newMessageData) // Debug log
        // Don't add to messages here - let Realtime handle it
        setNewMessage('')
        setSelectedFile(null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Error sending message: ${error}`)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
  }

  const handleSearch = (results: SearchResult[]) => {
    setSearchResults(results)
    setIsSearching(true)
  }

  const handleSearchClear = () => {
    setSearchResults([])
    setIsSearching(false)
  }

  const handlePinMessage = (message: Message) => {
    setPinnedMessage(message)
  }

  const handleUnpinMessage = () => {
    setPinnedMessage(null)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getOnlineStatus = (userId: string) => {
    return onlineUsers.includes(userId)
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  // Show notification
  const showNotification = (message: Message, sender: User) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${sender.name}`, {
        body: message.content,
        icon: '/favicon.ico',
        tag: 'chat-message'
      })
    }
  }

  // Update unread count
  const updateUnreadCount = () => {
    if (lastReadMessageId) {
      const unreadMessages = messages.filter(msg => 
        msg.id !== lastReadMessageId && 
        msg.sender_id !== user?.id &&
        new Date(msg.created_at) > new Date()
      )
      setUnreadCount(unreadMessages.length)
    }
  }

  // Mark messages as read
  const markAsRead = () => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      setLastReadMessageId(lastMessage.id)
      setUnreadCount(0)
    }
  }

  const getChatTitle = () => {
    switch (chatMode) {
      case 'company':
        return 'Company Chat'
      case 'project':
        return selectedProject?.name || 'Select Project'
      case 'direct':
        return selectedUser?.name || 'Select User'
      default:
        return 'Chat'
    }
  }

  const getChatSubtitle = () => {
    switch (chatMode) {
      case 'company':
        return `${users.length} members online`
      case 'project':
        return selectedProject ? `${selectedProject.members?.length || 0} project members` : 'Select a project'
      case 'direct':
        return selectedUser ? (getOnlineStatus(selectedUser.id) ? 'Online' : 'Last seen recently') : 'Select a user'
      default:
        return ''
    }
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
      <div className="h-screen flex bg-midnight-blue">
        {/* Mobile Sidebar */}
        <div className="lg:hidden fixed inset-0 z-50 bg-midnight-blue">
          <div className="w-80 h-full bg-dark-gray border-r border-gray-700 flex flex-col">
            {/* Mobile Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-soft-white">Messages</h1>
                <button 
                  onClick={() => {/* Close mobile sidebar */}}
                  className="p-2 text-light-gray hover:text-electric-purple transition-colors rounded-lg hover:bg-midnight-blue"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none text-sm"
                />
              </div>
              
              {/* Chat Mode Selector */}
              <div className="space-y-1">
                <button
                  onClick={() => setChatMode('company')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                    chatMode === 'company'
                      ? 'bg-electric-purple text-soft-white shadow-lg'
                      : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-electric-purple to-neon-blue rounded-full flex items-center justify-center mr-3">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Company Chat</div>
                      <div className="text-xs opacity-75">All team members</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setChatMode('project')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                    chatMode === 'project'
                      ? 'bg-electric-purple text-soft-white shadow-lg'
                      : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-aqua-green to-neon-blue rounded-full flex items-center justify-center mr-3">
                      <FolderIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Project Chat</div>
                      <div className="text-xs opacity-75">Project discussions</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setChatMode('direct')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                    chatMode === 'direct'
                      ? 'bg-electric-purple text-soft-white shadow-lg'
                      : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-coral to-electric-purple rounded-full flex items-center justify-center mr-3">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Direct Messages</div>
                      <div className="text-xs opacity-75">Private conversations</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Project/User Selection */}
            <div className="p-4 border-b border-gray-700 flex-1 overflow-y-auto">
              {chatMode === 'project' && (
                <div>
                  <h3 className="text-xs font-medium text-light-gray mb-3">Select Project</h3>
                  <div className="space-y-2">
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                          selectedProject?.id === project.id
                            ? 'bg-electric-purple text-soft-white'
                            : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-aqua-green to-neon-blue rounded-full flex items-center justify-center mr-3">
                            <FolderIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{project.name}</div>
                            <div className="text-xs opacity-75">{project.status}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMode === 'direct' && (
                <div>
                  <h3 className="text-xs font-medium text-light-gray mb-3">Select User</h3>
                  <div className="space-y-2">
                    {users.filter(u => u.id !== user?.id).map(userItem => (
                      <button
                        key={userItem.id}
                        onClick={() => setSelectedUser(userItem)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                          selectedUser?.id === userItem.id
                            ? 'bg-electric-purple text-soft-white'
                            : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-coral to-electric-purple rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold">{getInitials(userItem.name)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{userItem.name}</div>
                            <div className="text-xs opacity-75">
                              {getOnlineStatus(userItem.id) ? 'Online' : 'Offline'}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 bg-dark-gray border-r border-gray-700 flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-soft-white">Messages</h1>
              <button className="p-2 text-light-gray hover:text-electric-purple transition-colors rounded-lg hover:bg-midnight-blue">
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
              />
            </div>
            
            {/* Chat Mode Selector */}
            <div className="space-y-1">
              <button
                onClick={() => setChatMode('company')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  chatMode === 'company'
                    ? 'bg-electric-purple text-soft-white shadow-lg'
                    : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-electric-purple to-neon-blue rounded-full flex items-center justify-center mr-3">
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Company Chat</div>
                    <div className="text-xs opacity-75">All team members</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setChatMode('project')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  chatMode === 'project'
                    ? 'bg-electric-purple text-soft-white shadow-lg'
                    : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-aqua-green to-neon-blue rounded-full flex items-center justify-center mr-3">
                    <FolderIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Project Chat</div>
                    <div className="text-xs opacity-75">Project discussions</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setChatMode('direct')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  chatMode === 'direct'
                    ? 'bg-electric-purple text-soft-white shadow-lg'
                    : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-coral to-electric-purple rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Direct Messages</div>
                    <div className="text-xs opacity-75">Private conversations</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Project/User Selection */}
          <div className="p-6 border-b border-gray-700">
            {chatMode === 'project' && (
              <div>
                <h3 className="text-sm font-medium text-light-gray mb-3">Select Project</h3>
                <div className="space-y-2">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedProject?.id === project.id
                          ? 'bg-electric-purple text-soft-white'
                          : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-aqua-green to-neon-blue rounded-lg flex items-center justify-center mr-3">
                          <FolderIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs opacity-75">{project.status}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMode === 'direct' && (
              <div>
                <h3 className="text-sm font-medium text-light-gray mb-3">Select User</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.filter(u => u.id !== user?.id).map(userItem => (
                    <button
                      key={userItem.id}
                      onClick={() => setSelectedUser(userItem)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedUser?.id === userItem.id
                          ? 'bg-electric-purple text-soft-white'
                          : 'text-light-gray hover:bg-midnight-blue hover:text-soft-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-coral to-electric-purple rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium">{getInitials(userItem.name)}</span>
                          </div>
                          {getOnlineStatus(userItem.id) && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-aqua-green rounded-full border-2 border-dark-gray"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{userItem.name}</div>
                          <div className="text-xs opacity-75">
                            {getOnlineStatus(userItem.id) ? 'Online' : 'Offline'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6">
            <div className="space-y-2">
              <button
                onClick={() => setIsSearching(!isSearching)}
                className="w-full flex items-center px-4 py-3 text-light-gray hover:text-soft-white hover:bg-midnight-blue rounded-lg transition-colors"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-3" />
                Search Messages
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="w-full flex items-center px-4 py-3 text-light-gray hover:text-soft-white hover:bg-midnight-blue rounded-lg transition-colors"
              >
                <PaperClipIcon className="h-5 w-5 mr-3" />
                File Library
              </button>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-dark-gray border-b border-gray-700 p-3 md:p-4 flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-electric-purple to-neon-blue rounded-full flex items-center justify-center mr-2 md:mr-4 flex-shrink-0">
                <span className="text-sm md:text-lg font-bold">{getInitials(getChatTitle())}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm md:text-lg font-semibold text-soft-white truncate">{getChatTitle()}</h2>
                <p className="text-xs md:text-sm text-light-gray truncate">{getChatSubtitle()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
              <button className="p-1 md:p-2 text-light-gray hover:text-electric-purple transition-colors rounded-lg hover:bg-midnight-blue">
                <PhoneIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button className="p-1 md:p-2 text-light-gray hover:text-electric-purple transition-colors rounded-lg hover:bg-midnight-blue">
                <VideoCameraIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button className="p-1 md:p-2 text-light-gray hover:text-electric-purple transition-colors rounded-lg hover:bg-midnight-blue">
                <EllipsisVerticalIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-midnight-blue to-dark-gray">
            <div className="p-2 md:p-4 space-y-2 md:space-y-4">
              {/* Pinned Message */}
              {pinnedMessage && (
                <PinnedMessage
                  message={pinnedMessage}
                  sender={users.find(u => u.id === pinnedMessage.sender_id) || {} as User}
                  onUnpin={handleUnpinMessage}
                />
              )}

              {/* Messages */}
              {messages.map((message, index) => {
                const sender = users.find(u => u.id === message.sender_id)
                const isOwnMessage = message.sender_id === user?.id
                const prevMessage = messages[index - 1]
                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id
                const showDate = !prevMessage || 
                  new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString()

                return (
                  <div key={message.id}>
                    {/* Date Separator */}
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-midnight-blue px-3 py-1 rounded-full text-xs text-light-gray">
                          {formatDate(message.created_at)}
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}>
                      <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        {showAvatar && (
                          <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-3' : 'mr-3'}`}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-electric-purple flex items-center justify-center">
                              <span className="text-xs font-medium text-soft-white">
                                {getInitials(sender?.name || 'U')}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Message Content */}
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          {/* Sender Name */}
                          {showAvatar && (
                            <div className={`text-xs text-light-gray mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                              {sender?.name || 'Unknown'}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwnMessage 
                                ? 'bg-gradient-to-r from-electric-purple to-neon-blue text-soft-white rounded-br-md' 
                                : 'bg-dark-gray text-soft-white rounded-bl-md border border-gray-600'
                            }`}
                          >
                            {message.message_type === 'file' ? (
                              <div className="flex items-center space-x-2">
                                <PaperClipIcon className="h-4 w-4" />
                                <span>File attachment</span>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            )}
                          </div>

                          {/* Message Time & Read Receipt */}
                          <div className={`flex items-center space-x-1 mt-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-xs text-light-gray">
                              {formatTime(message.created_at)}
                            </span>
                            {isOwnMessage && (
                              <ReadReceipt
                                isRead={true}
                                isDelivered={true}
                                readAt={message.created_at}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Typing Indicator */}
              <TypingIndicator
                typingUsers={typingUsers}
                currentUserId={user?.id || ''}
              />

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-dark-gray border-t border-gray-700 p-2 md:p-4">
            {/* File Upload */}
            {selectedFile && (
              <div className="mb-3 md:mb-4">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onRemove={handleFileRemove}
                  selectedFile={selectedFile}
                />
              </div>
            )}

            {/* Message Input */}
            <div className="flex items-end space-x-2 md:space-x-3">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 md:p-2 text-light-gray hover:text-electric-purple transition-colors rounded-lg hover:bg-midnight-blue"
              >
                <FaceSmileIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-midnight-blue text-soft-white rounded-2xl border border-gray-600 focus:border-electric-purple focus:outline-none resize-none text-sm md:text-base"
                />
                <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-light-gray hover:text-electric-purple transition-colors"
                  >
                    <PhotoIcon className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-light-gray hover:text-electric-purple transition-colors"
                  >
                    <DocumentIcon className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !selectedFile}
                className="p-2 md:p-3 bg-gradient-to-r from-electric-purple to-neon-blue text-soft-white rounded-full hover:from-neon-blue hover:to-electric-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <ArrowUpIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Panel */}
        {isSearching && (
          <div className="w-80 bg-dark-gray border-l border-gray-700 p-4">
            <MessageSearch
              messages={messages}
              users={users}
              onSearch={handleSearch}
              onClear={handleSearchClear}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
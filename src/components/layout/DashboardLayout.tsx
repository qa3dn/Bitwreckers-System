'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import UnreadBadge from '@/components/UnreadBadge'
import {
  HomeIcon,
  FolderIcon,
  CheckIcon,
  UsersIcon,
  UserIcon,
  ChartBarIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  CalendarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Tasks', href: '/tasks', icon: CheckIcon },
    { name: 'To Do', href: '/personal-todos', icon: CheckIcon },
    { name: 'Suggestions', href: '/suggestions', icon: LightBulbIcon },
    { name: 'Meetings', href: '/meetings', icon: CalendarIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Team', href: '/team', icon: UsersIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
  ]

  // Add New Task navigation for team leads and project managers
  const taskNavigation = [
    { name: 'New Task', href: '/tasks/new', icon: PlusIcon, roles: ['team-lead', 'project-manager'] },
  ]

  // Add admin navigation for team leads
  const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: ChartBarIcon },
    { name: 'Member Management', href: '/member-management', icon: UserIcon },
  ]

  // Add project manager navigation
  const projectManagerNavigation = [
    { name: 'Project Manager', href: '/project-manager', icon: FolderIcon },
  ]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { userProfile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-midnight-blue">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}
      suppressHydrationWarning={true}>
        <div className="fixed inset-0 bg-transparent-black" onClick={() => setSidebarOpen(false)} suppressHydrationWarning={true} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-dark-gray" suppressHydrationWarning={true}>
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-soft-white">Bitwreckers System</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-light-gray hover:text-soft-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-electric-purple text-soft-white"
                      : "text-light-gray hover:bg-dark-gray hover:text-soft-white"
                  )}
                >
                  {item.name === 'Chat' ? (
                    <UnreadBadge userId={userProfile?.id}>
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                        )}
                      />
                    </UnreadBadge>
                  ) : (
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                      )}
                    />
                  )}
                  {item.name}
                </Link>
              )
            })}
            
            {/* New Task - Only for Team Leads and Project Managers */}
            {taskNavigation.map((item) => {
              const isActive = pathname === item.href
              const hasPermission = item.roles?.includes(userProfile?.role || '')
              
              if (!hasPermission) return null
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-electric-purple text-soft-white"
                      : "text-light-gray hover:bg-dark-gray hover:text-soft-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-light-gray p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-electric-purple flex items-center justify-center">
                  <span className="text-sm font-medium text-soft-white">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-soft-white">{userProfile?.name || 'User'}</p>
                <p className="text-xs text-light-gray">{userProfile?.role || 'member'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-3 flex w-full items-center px-2 py-2 text-sm text-light-gray hover:text-soft-white hover:bg-dark-gray rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-dark-gray">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-soft-white">Bitwreckers System</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-electric-purple text-soft-white"
                      : "text-light-gray hover:bg-dark-gray hover:text-soft-white"
                  )}
                >
                  {item.name === 'Chat' ? (
                    <UnreadBadge userId={userProfile?.id}>
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                        )}
                      />
                    </UnreadBadge>
                  ) : (
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                      )}
                    />
                  )}
                  {item.name}
                </Link>
              )
            })}
            
            {/* New Task - Only for Team Leads and Project Managers */}
            {taskNavigation.map((item) => {
              const isActive = pathname === item.href
              const hasPermission = item.roles?.includes(userProfile?.role || '')
              
              if (!hasPermission) return null
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-electric-purple text-soft-white"
                      : "text-light-gray hover:bg-dark-gray hover:text-soft-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Admin Panel for Team Leads */}
            {userProfile?.role === 'team-lead' && (
              <div className="border-t border-light-gray pt-4 mt-4">
                <p className="px-2 text-xs font-semibold text-light-gray uppercase tracking-wider mb-2">
                  Administration
                </p>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-electric-purple text-soft-white"
                          : "text-light-gray hover:bg-dark-gray hover:text-soft-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                        )}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Project Manager Panel */}
            {userProfile?.role === 'project-manager' && (
              <div className="border-t border-light-gray pt-4 mt-4">
                <p className="px-2 text-xs font-semibold text-light-gray uppercase tracking-wider mb-2">
                  Management
                </p>
                {projectManagerNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-electric-purple text-soft-white"
                          : "text-light-gray hover:bg-dark-gray hover:text-soft-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-soft-white" : "text-light-gray group-hover:text-soft-white"
                        )}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </nav>
          <div className="border-t border-light-gray p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-electric-purple flex items-center justify-center">
                  <span className="text-sm font-medium text-soft-white">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-soft-white">{userProfile?.name || 'User'}</p>
                <p className="text-xs text-light-gray">{userProfile?.role || 'member'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-3 flex w-full items-center px-2 py-2 text-sm text-light-gray hover:text-soft-white hover:bg-dark-gray rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 bg-dark-gray lg:bg-transparent">
          <button
            type="button"
            className="border-r border-light-gray px-4 text-light-gray focus:outline-none focus:ring-2 focus:ring-inset focus:ring-electric-purple lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              <div className="flex w-full items-center justify-center lg:justify-start">
                <h2 className="text-lg font-semibold text-soft-white">
                  {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

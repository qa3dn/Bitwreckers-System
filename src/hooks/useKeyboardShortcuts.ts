'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey
      const altMatch = !!shortcut.altKey === event.altKey
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch
    })

    if (matchingShortcut) {
      event.preventDefault()
      matchingShortcut.action()
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Common keyboard shortcuts for the app
export function useAppKeyboardShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Open search modal or focus search input
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus search'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => router.push('/tasks/new'),
      description: 'New task'
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => router.push('/projects/new'),
      description: 'New project'
    },
    {
      key: 'c',
      ctrlKey: true,
      action: () => router.push('/chat'),
      description: 'Open chat'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => router.push('/'),
      description: 'Go to dashboard'
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => router.push('/tasks'),
      description: 'Go to tasks'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => router.push('/reports'),
      description: 'Go to reports'
    },
    {
      key: 'u',
      ctrlKey: true,
      action: () => router.push('/team'),
      description: 'Go to team'
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or dropdowns
        const modals = document.querySelectorAll('[role="dialog"]')
        modals.forEach(modal => {
          const closeButton = modal.querySelector('[aria-label="Close"], [data-dismiss="modal"]') as HTMLButtonElement
          if (closeButton) closeButton.click()
        })
      },
      description: 'Close modals'
    }
  ]

  useKeyboardShortcuts(shortcuts)
}

// Chat-specific keyboard shortcuts
export function useChatKeyboardShortcuts(
  onSendMessage: () => void,
  onFocusInput: () => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Enter',
      action: (e) => {
        if (e?.shiftKey) {
          // Allow new line with Shift+Enter
          return
        }
        onSendMessage()
      },
      description: 'Send message'
    },
    {
      key: 'Enter',
      shiftKey: true,
      action: () => {
        // Allow new line
      },
      description: 'New line'
    },
    {
      key: 'ArrowUp',
      action: () => {
        // Navigate to previous message or edit last message
        const messages = document.querySelectorAll('[data-message-id]')
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1] as HTMLElement
          lastMessage.focus()
        }
      },
      description: 'Navigate to previous message'
    },
    {
      key: 'ArrowDown',
      action: () => {
        // Navigate to next message or focus input
        onFocusInput()
      },
      description: 'Navigate to next message'
    },
    {
      key: 'Escape',
      action: () => {
        // Clear input or close chat
        const input = document.querySelector('input[type="text"], textarea') as HTMLInputElement
        if (input) {
          input.value = ''
          input.blur()
        }
      },
      description: 'Clear input'
    }
  ]

  useKeyboardShortcuts(shortcuts)
}

// Task-specific keyboard shortcuts
export function useTaskKeyboardShortcuts(
  onCompleteTask: (taskId: string) => void,
  onEditTask: (taskId: string) => void,
  onDeleteTask: (taskId: string) => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'c',
      ctrlKey: true,
      action: () => {
        // Complete selected task
        const selectedTask = document.querySelector('[data-task-id][aria-selected="true"]')
        if (selectedTask) {
          const taskId = selectedTask.getAttribute('data-task-id')
          if (taskId) onCompleteTask(taskId)
        }
      },
      description: 'Complete selected task'
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => {
        // Edit selected task
        const selectedTask = document.querySelector('[data-task-id][aria-selected="true"]')
        if (selectedTask) {
          const taskId = selectedTask.getAttribute('data-task-id')
          if (taskId) onEditTask(taskId)
        }
      },
      description: 'Edit selected task'
    },
    {
      key: 'Delete',
      action: () => {
        // Delete selected task
        const selectedTask = document.querySelector('[data-task-id][aria-selected="true"]')
        if (selectedTask) {
          const taskId = selectedTask.getAttribute('data-task-id')
          if (taskId) onDeleteTask(taskId)
        }
      },
      description: 'Delete selected task'
    },
    {
      key: 'ArrowUp',
      action: () => {
        // Navigate to previous task
        const tasks = document.querySelectorAll('[data-task-id]')
        const currentIndex = Array.from(tasks).findIndex(task => 
          task.getAttribute('aria-selected') === 'true'
        )
        if (currentIndex > 0) {
          tasks[currentIndex - 1].setAttribute('aria-selected', 'true')
          tasks[currentIndex].setAttribute('aria-selected', 'false')
        }
      },
      description: 'Navigate to previous task'
    },
    {
      key: 'ArrowDown',
      action: () => {
        // Navigate to next task
        const tasks = document.querySelectorAll('[data-task-id]')
        const currentIndex = Array.from(tasks).findIndex(task => 
          task.getAttribute('aria-selected') === 'true'
        )
        if (currentIndex < tasks.length - 1) {
          tasks[currentIndex + 1].setAttribute('aria-selected', 'true')
          tasks[currentIndex].setAttribute('aria-selected', 'false')
        }
      },
      description: 'Navigate to next task'
    }
  ]

  useKeyboardShortcuts(shortcuts)
}

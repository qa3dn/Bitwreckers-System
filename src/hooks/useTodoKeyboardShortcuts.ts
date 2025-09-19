'use client'

import { useEffect } from 'react'

interface UseTodoKeyboardShortcutsProps {
  onAddTodo: () => void
  onToggleFilters: () => void
  onSearch: (query: string) => void
  onViewModeChange: (mode: 'list' | 'kanban' | 'calendar' | 'stats') => void
  onTogglePomodoro: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export default function useTodoKeyboardShortcuts({
  onAddTodo,
  onToggleFilters,
  onSearch,
  onViewModeChange,
  onTogglePomodoro,
  searchQuery,
  setSearchQuery
}: UseTodoKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Ctrl/Cmd + K: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }

      // Ctrl/Cmd + N: Add new todo
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault()
        onAddTodo()
      }

      // Ctrl/Cmd + F: Toggle filters
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        onToggleFilters()
      }

      // Ctrl/Cmd + 1-4: Switch view modes
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '4') {
        event.preventDefault()
        const viewModes: ('list' | 'kanban' | 'calendar' | 'stats')[] = ['list', 'kanban', 'calendar', 'stats']
        const modeIndex = parseInt(event.key) - 1
        if (modeIndex < viewModes.length) {
          onViewModeChange(viewModes[modeIndex])
        }
      }

      // Ctrl/Cmd + P: Toggle Pomodoro
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault()
        onTogglePomodoro()
      }

      // Escape: Clear search
      if (event.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('')
          onSearch('')
        }
      }

      // Quick search with letters
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput && document.activeElement !== searchInput) {
          setSearchQuery(event.key)
          onSearch(event.key)
          searchInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onAddTodo, onToggleFilters, onSearch, onViewModeChange, onTogglePomodoro, searchQuery, setSearchQuery])
}

'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: '⌘1', description: 'Switch to List View' },
        { key: '⌘2', description: 'Switch to Kanban View' },
        { key: '⌘3', description: 'Switch to Calendar View' },
        { key: '⌘4', description: 'Switch to Statistics View' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { key: '⌘N', description: 'Add New Task' },
        { key: '⌘K', description: 'Focus Search' },
        { key: '⌘F', description: 'Toggle Filters' },
        { key: '⌘P', description: 'Toggle Pomodoro Timer' },
      ]
    },
    {
      category: 'General',
      items: [
        { key: 'Esc', description: 'Clear Search' },
        { key: 'Any Letter', description: 'Quick Search (when not focused on input)' },
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-700">{item.description}</span>
                      <kbd className="px-2 py-1 bg-slate-200 text-slate-700 text-sm font-mono rounded">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use keyboard shortcuts to work faster without reaching for the mouse</li>
              <li>• Press any letter key to quickly start searching when not focused on an input</li>
              <li>• Use ⌘1-4 to quickly switch between different views</li>
              <li>• Press Esc to clear your search and see all tasks</li>
            </ul>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

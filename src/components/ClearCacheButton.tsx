'use client'

import { useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function ClearCacheButton() {
  const [isClearing, setIsClearing] = useState(false)

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      // Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear IndexedDB if exists
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases()
            await Promise.all(
              databases.map(db => {
                if (db.name) {
                  return new Promise((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name)
                    deleteReq.onsuccess = () => resolve(true)
                    deleteReq.onerror = () => reject(deleteReq.error)
                  })
                }
              })
            )
          } catch (error) {
            console.log('Could not clear IndexedDB:', error)
          }
        }
      }
      
      // Force reload
      window.location.reload()
    } catch (error) {
      console.error('Error clearing cache:', error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <button
      onClick={handleClearCache}
      disabled={isClearing}
      className="flex items-center space-x-2 px-3 py-2 text-sm text-light-gray hover:text-soft-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
      title="Clear cache and reload"
    >
      <TrashIcon className="h-4 w-4" />
      <span>{isClearing ? 'Clearing...' : 'Clear Cache'}</span>
    </button>
  )
}

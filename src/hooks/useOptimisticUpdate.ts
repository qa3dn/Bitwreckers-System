'use client'

import { useState, useCallback } from 'react'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  rollbackOnError?: boolean
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T>(initialData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateOptimistically = useCallback(
    async (
      optimisticUpdate: (currentData: T) => T,
      actualUpdate: () => Promise<T>
    ) => {
      const previousData = data
      
      try {
        setIsUpdating(true)
        setError(null)
        
        // Apply optimistic update immediately
        const optimisticData = optimisticUpdate(data)
        setData(optimisticData)
        
        // Perform actual update
        const actualData = await actualUpdate()
        setData(actualData)
        
        // Call success callback
        options.onSuccess?.(actualData)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Update failed')
        setError(error)
        
        // Rollback to previous data if enabled
        if (options.rollbackOnError !== false) {
          setData(previousData)
        }
        
        // Call error callback
        options.onError?.(error)
      } finally {
        setIsUpdating(false)
      }
    },
    [data, options]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setIsUpdating(false)
  }, [initialData])

  return {
    data,
    isUpdating,
    error,
    updateOptimistically,
    reset
  }
}

// Hook for optimistic updates with array data
export function useOptimisticArrayUpdate<T>(
  initialData: T[],
  options: OptimisticUpdateOptions<T[]> = {}
) {
  const [data, setData] = useState<T[]>(initialData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addOptimistically = useCallback(
    async (
      newItem: T,
      actualAdd: () => Promise<T>
    ) => {
      const previousData = data
      
      try {
        setIsUpdating(true)
        setError(null)
        
        // Add item optimistically
        setData(prev => [...prev, newItem])
        
        // Perform actual add
        const actualItem = await actualAdd()
        setData(prev => prev.map(item => item === newItem ? actualItem : item))
        
        options.onSuccess?.(data)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Add failed')
        setError(error)
        
        if (options.rollbackOnError !== false) {
          setData(previousData)
        }
        
        options.onError?.(error)
      } finally {
        setIsUpdating(false)
      }
    },
    [data, options]
  )

  const updateOptimistically = useCallback(
    async (
      itemId: string | number,
      optimisticUpdate: (item: T) => T,
      actualUpdate: () => Promise<T>
    ) => {
      const previousData = data
      
      try {
        setIsUpdating(true)
        setError(null)
        
        // Update item optimistically
        setData(prev => prev.map(item => 
          (item as any).id === itemId ? optimisticUpdate(item) : item
        ))
        
        // Perform actual update
        const actualItem = await actualUpdate()
        setData(prev => prev.map(item => 
          (item as any).id === itemId ? actualItem : item
        ))
        
        options.onSuccess?.(data)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Update failed')
        setError(error)
        
        if (options.rollbackOnError !== false) {
          setData(previousData)
        }
        
        options.onError?.(error)
      } finally {
        setIsUpdating(false)
      }
    },
    [data, options]
  )

  const removeOptimistically = useCallback(
    async (
      itemId: string | number,
      actualRemove: () => Promise<void>
    ) => {
      const previousData = data
      
      try {
        setIsUpdating(true)
        setError(null)
        
        // Remove item optimistically
        setData(prev => prev.filter(item => (item as any).id !== itemId))
        
        // Perform actual remove
        await actualRemove()
        
        options.onSuccess?.(data)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Remove failed')
        setError(error)
        
        if (options.rollbackOnError !== false) {
          setData(previousData)
        }
        
        options.onError?.(error)
      } finally {
        setIsUpdating(false)
      }
    },
    [data, options]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setIsUpdating(false)
  }, [initialData])

  return {
    data,
    isUpdating,
    error,
    addOptimistically,
    updateOptimistically,
    removeOptimistically,
    reset
  }
}

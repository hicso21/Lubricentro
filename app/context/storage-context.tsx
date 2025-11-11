'use client'

import { createContext, useState, useCallback, ReactNode } from 'react'

export interface StorageContextType {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

export const StorageContext = createContext<StorageContextType | undefined>(undefined)

// Hook interno con toda la lógica
function useStorageState(): StorageContextType {
  const [storage, setStorage] = useState<Record<string, string>>({})

  const getItem = useCallback((key: string): string | null => {
    return storage[key] || null
  }, [storage])

  const setItem = useCallback((key: string, value: string) => {
    setStorage(prev => ({ ...prev, [key]: value }))
  }, [])

  const removeItem = useCallback((key: string) => {
    setStorage(prev => {
      const newStorage = { ...prev }
      delete newStorage[key]
      return newStorage
    })
  }, [])

  const clear = useCallback(() => {
    setStorage({})
  }, [])

  return { getItem, setItem, removeItem, clear }
}

// Provider limpio
export function StorageProvider({ children }: { children: ReactNode }) {
  const storage = useStorageState()

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  )
}
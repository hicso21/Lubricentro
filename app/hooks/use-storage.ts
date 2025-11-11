import { useContext } from 'react'
import { StorageContext, type StorageContextType } from '@/context/storage-context'

export function useStorage(): StorageContextType {
  const context = useContext(StorageContext)
  
  if (!context) {
    throw new Error('useStorage must be used within StorageProvider')
  }
  
  return context
}
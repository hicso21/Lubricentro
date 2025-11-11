import { useState, useEffect, useRef } from "react"
import { OfflineSync } from "@/lib/offline-sync"
import { ProductService } from "@/lib/product-service"
import { useStorage } from "@/hooks/use-storage"

export function useOfflineSync() {
  const storage = useStorage()
  // ✅ Estado inicial consistente entre servidor y cliente
  const [isOnline, setIsOnline] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false) // ✅ Nuevo estado
  const [syncing, setSyncing] = useState(false)
  const [pendingItems, setPendingItems] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  
  const isInitialized = useRef(false)
  const isSyncing = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    // ✅ Marcar como hidratado y establecer valor real
    setIsHydrated(true)
    setIsOnline(navigator.onLine)

    OfflineSync.setStorage(storage)
    setLastSync(OfflineSync.getLastSyncTime())
    updatePendingCount()

    const handleOnline = () => {
      setIsOnline(true)
      autoSync()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    if (navigator.onLine) {
      autoSync()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const updatePendingCount = () => {
    const pendingSales = OfflineSync.getPendingSales().length
    const pendingOrders = OfflineSync.getPendingPurchaseOrders().length
    setPendingItems(pendingSales + pendingOrders)
  }

  const autoSync = async () => {
    if (!navigator.onLine || isSyncing.current) return
    
    const storage = OfflineSync['getStorage']()
    const settingsStr = storage.getItem("lubricentro_settings")
    const autoSyncEnabled = settingsStr ? JSON.parse(settingsStr).autoSync : true

    if (autoSyncEnabled) {
      await syncData()
    }
  }

  const syncData = async (): Promise<boolean> => {
    if (!navigator.onLine || isSyncing.current) return false

    isSyncing.current = true
    setSyncing(true)

    try {
      console.log('🔄 Iniciando sync...')
      
      const { data: productsData, error } = await ProductService.getAllProducts()
      
      if (productsData && !error) {
        console.log(`✅ ${productsData.length} productos obtenidos de la API`)
        
        const currentProducts = OfflineSync.getProductsFromLocal()
        const needsUpdate = JSON.stringify(currentProducts) !== JSON.stringify(productsData)
        
        if (needsUpdate) {
          console.log('📦 Actualizando productos locales...')
          OfflineSync.saveProductsToLocal(productsData)
        } else {
          console.log('✓ Productos ya están actualizados')
        }
        
        setLastSync(new Date())
      }

      const pendingSales = OfflineSync.getPendingSales()
      const pendingOrders = OfflineSync.getPendingPurchaseOrders()

      if (pendingSales.length > 0) {
        console.log(`📤 Enviando ${pendingSales.length} ventas pendientes...`)
        OfflineSync.clearPendingSales()
      }

      if (pendingOrders.length > 0) {
        console.log(`📤 Enviando ${pendingOrders.length} órdenes pendientes...`)
        OfflineSync.clearPendingPurchaseOrders()
      }

      OfflineSync.markLastSync()
      updatePendingCount()
      console.log('✅ Sync completado')
      return true
    } catch (error) {
      console.error("❌ Error en sync:", error)
      return false
    } finally {
      setSyncing(false)
      isSyncing.current = false
    }
  }

  const forceSync = async () => {
    return await syncData()
  }

  return {
    isOnline,
    isHydrated, // ✅ Exportar nuevo estado
    syncing,
    pendingItems,
    lastSync,
    syncData: forceSync,
    updatePendingCount,
  }
}
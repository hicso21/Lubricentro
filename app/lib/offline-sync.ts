import type { Product, Sale, PurchaseOrder } from "./types";

const STORAGE_KEYS = {
  PRODUCTS: "lubricentro_products",
  SALES: "lubricentro_sales",
  PURCHASE_ORDERS: "lubricentro_purchase_orders",
  LAST_SYNC: "lubricentro_last_sync",
  SETTINGS: "lubricentro_settings",
  LAST_BACKUP: "lubricentro_last_backup",
  PRODUCTS_TIMESTAMP: "lubricentro_products_timestamp",
  LAST_SYNC_TIMESTAMP: "lubricentro_last_sync_timestamp",
};

export class OfflineSync {
  private static storage: any = null;

  /**
   * Inicializar el storage (llamar desde un componente con useStorage)
   */
  static setStorage(storage: any) {
    this.storage = storage;
  }

  /**
   * Obtener el storage, lanzar error si no está inicializado
   */
  private static getStorage() {
    if (!this.storage) {
      throw new Error(
        "OfflineSync: Storage no inicializado. Llama a OfflineSync.setStorage() primero."
      );
    }
    return this.storage;
  }

  // ============================================
  // ÓRDENES DE COMPRA
  // ============================================

  static savePendingPurchaseOrder(order: Omit<PurchaseOrder, "id">) {
    const storage = this.getStorage();
    const pending = this.getPendingPurchaseOrders();
    pending.push({ ...order, id: `temp_${Date.now()}` });
    storage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pending));
  }

  static getPendingPurchaseOrders(): PurchaseOrder[] {
    const storage = this.getStorage();
    const stored = storage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
    return stored ? JSON.parse(stored) : [];
  }

  static clearPendingPurchaseOrders() {
    const storage = this.getStorage();
    storage.removeItem(STORAGE_KEYS.PURCHASE_ORDERS);
  }

  // ============================================
  // VENTAS
  // ============================================

  static savePendingSale(sale: Omit<Sale, "id"> & { id?: string }): void {
    try {
      const storage = this.getStorage();
      const pendingSales = this.getPendingSales();
      const saleWithId = {
        ...sale,
        id:
          sale.id ||
          `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: sale.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      pendingSales.push(saleWithId);
      storage.setItem(STORAGE_KEYS.SALES, JSON.stringify(pendingSales));

      console.log(
        "📦 Venta guardada para sincronización:",
        saleWithId.sale_number
      );
    } catch (error) {
      console.error("Error guardando venta pendiente:", error);
    }
  }

  static getPendingSales(): Sale[] {
    try {
      const storage = this.getStorage();
      const stored = storage.getItem(STORAGE_KEYS.SALES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error obteniendo ventas pendientes:", error);
      return [];
    }
  }

  static removePendingSale(saleId: string): void {
    try {
      const storage = this.getStorage();
      const pendingSales = this.getPendingSales();
      const filtered = pendingSales.filter((sale) => sale.id !== saleId);
      storage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filtered));

      console.log("✅ Venta sincronizada y eliminada de pendientes:", saleId);
    } catch (error) {
      console.error("Error eliminando venta pendiente:", error);
    }
  }

  static clearPendingSales(): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(STORAGE_KEYS.SALES);
      console.log("🗑️ Todas las ventas pendientes eliminadas");
    } catch (error) {
      console.error("Error limpiando ventas pendientes:", error);
    }
  }

  // ============================================
  // PRODUCTOS
  // ============================================

  static updateLocalProductStock(productId: string, newStock: number): void {
    try {
      const products = this.getProductsFromLocal();
      const updatedProducts = products.map((product) =>
        product.id === productId
          ? {
              ...product,
              stock: newStock,
              updated_at: new Date().toISOString(),
            }
          : product
      );

      this.saveProductsToLocal(updatedProducts);
      console.log(
        `📦 Stock local actualizado para producto ${productId}: ${newStock}`
      );
    } catch (error) {
      console.error("Error actualizando stock local:", error);
    }
  }

  static getProductsFromLocal(): Product[] {
    try {
      const storage = this.getStorage();
      const stored = storage.getItem(STORAGE_KEYS.PRODUCTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error obteniendo productos locales:", error);
      return [];
    }
  }

  static saveProductsToLocal(products: Product[]): void {
    try {
      console.log("📦 saveProductsToLocal llamado desde:");
      console.trace(); // Esto mostrará de dónde viene la llamada

      const storage = this.getStorage();
      storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      storage.setItem(
        STORAGE_KEYS.PRODUCTS_TIMESTAMP,
        new Date().toISOString()
      );
      console.log(`📦 ${products.length} productos guardados localmente`);
    } catch (error) {
      console.error("Error guardando productos localmente:", error);
    }
  }

  // ============================================
  // ESTADO Y SINCRONIZACIÓN
  // ============================================

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static getLastSyncTime(): Date | null {
    try {
      const storage = this.getStorage();
      const stored = storage.getItem(STORAGE_KEYS.LAST_SYNC);
      return stored ? new Date(stored) : null;
    } catch (error) {
      return null;
    }
  }

  static markLastSync(): void {
    try {
      const storage = this.getStorage();
      storage.setItem(
        STORAGE_KEYS.LAST_SYNC_TIMESTAMP,
        new Date().toISOString()
      );
    } catch (error) {
      console.error("Error marcando timestamp de sync:", error);
    }
  }

  static getSyncStats() {
    try {
      const storage = this.getStorage();
      return {
        pendingSalesCount: this.getPendingSales().length,
        pendingOrdersCount: this.getPendingPurchaseOrders().length,
        lastSyncTimestamp: storage.getItem(STORAGE_KEYS.LAST_SYNC_TIMESTAMP),
        localProductsCount: this.getProductsFromLocal().length,
        localProductsTimestamp: storage.getItem(
          STORAGE_KEYS.PRODUCTS_TIMESTAMP
        ),
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas de sync:", error);
      return {
        pendingSalesCount: 0,
        pendingOrdersCount: 0,
        lastSyncTimestamp: null,
        localProductsCount: 0,
        localProductsTimestamp: null,
      };
    }
  }

  static needsSync(): boolean {
    try {
      const pendingSales = this.getPendingSales();
      const pendingOrders = this.getPendingPurchaseOrders();
      const storage = this.getStorage();
      const lastSync = storage.getItem(STORAGE_KEYS.LAST_SYNC_TIMESTAMP);

      // Necesita sync si hay datos pendientes
      if (pendingSales.length > 0 || pendingOrders.length > 0) return true;

      // Necesita sync si hace más de 1 hora del último sync
      if (!lastSync) return true;

      const hoursSinceLastSync =
        (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
      return hoursSinceLastSync > 1;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // VALIDACIÓN Y RESPALDO
  // ============================================

  static validateLocalData(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const storage = this.getStorage();

      // Validar productos locales
      const products = this.getProductsFromLocal();
      if (products.length === 0) {
        warnings.push("No hay productos guardados localmente");
      }

      // Validar estructura de productos
      for (const product of products) {
        if (!product.id) errors.push(`Producto sin ID encontrado`);
        if (!product.barcode)
          errors.push(`Producto ${product.id} sin código de barras`);
        if (product.stock < 0)
          errors.push(
            `Producto ${product.id} con stock negativo: ${product.stock}`
          );
      }

      // Validar ventas pendientes
      const pendingSales = this.getPendingSales();
      for (const sale of pendingSales) {
        if (!sale.product_id) errors.push(`Venta pendiente sin product_id`);
        if (sale.quantity <= 0)
          errors.push(
            `Venta pendiente con cantidad inválida: ${sale.quantity}`
          );
        if (!sale.sale_number)
          errors.push(`Venta pendiente sin número de venta`);
      }

      // Verificar timestamps
      const productsTimestamp = storage.getItem(
        STORAGE_KEYS.PRODUCTS_TIMESTAMP
      );
      if (!productsTimestamp) {
        warnings.push("No hay timestamp para productos locales");
      } else {
        const age = Date.now() - new Date(productsTimestamp).getTime();
        const hoursOld = age / (1000 * 60 * 60);
        if (hoursOld > 24) {
          warnings.push(
            `Los productos locales tienen ${Math.round(
              hoursOld
            )} horas de antigüedad`
          );
        }
      }

      return { isValid: errors.length === 0, errors, warnings };
    } catch (error: any) {
      errors.push(`Error validando datos locales: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }

  static exportLocalData(): {
    products: Product[];
    pendingSales: Sale[];
    pendingOrders: PurchaseOrder[];
    timestamp: string;
    stats: any;
  } {
    return {
      products: this.getProductsFromLocal(),
      pendingSales: this.getPendingSales(),
      pendingOrders: this.getPendingPurchaseOrders(),
      timestamp: new Date().toISOString(),
      stats: this.getSyncStats(),
    };
  }

  static importLocalData(data: {
    products?: Product[];
    pendingSales?: Sale[];
    pendingOrders?: PurchaseOrder[];
  }): { success: boolean; message: string } {
    try {
      const storage = this.getStorage();

      if (data.products) {
        this.saveProductsToLocal(data.products);
      }

      if (data.pendingSales) {
        storage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data.pendingSales));
      }

      if (data.pendingOrders) {
        storage.setItem(
          STORAGE_KEYS.PURCHASE_ORDERS,
          JSON.stringify(data.pendingOrders)
        );
      }

      return {
        success: true,
        message: `Datos importados: ${data.products?.length || 0} productos, ${
          data.pendingSales?.length || 0
        } ventas, ${data.pendingOrders?.length || 0} pedidos`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error importando datos: ${error.message}`,
      };
    }
  }
}

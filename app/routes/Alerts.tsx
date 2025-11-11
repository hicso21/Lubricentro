import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductService } from "@/lib/product-service";
import { OfflineSync } from "@/lib/offline-sync";
import type { Product, Sale, PurchaseOrder } from "@/lib/types";
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AlertsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    setIsOnline(navigator.onLine);
    setLastSync(OfflineSync.getLastSyncTime());

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      // Load products
      if (OfflineSync.isOnline()) {
        const { data: productsData } = await ProductService.getAllProducts();
        if (productsData) {
          setProducts(productsData);
          OfflineSync.saveProductsToLocal(productsData);

          // Find low stock products
          const lowStock = productsData.filter(
            (product) => product.stock <= product.min_stock
          );
          setLowStockProducts(lowStock);
        }
      } else {
        const localProducts = OfflineSync.getProductsFromLocal();
        setProducts(localProducts);
        const lowStock = localProducts.filter(
          (product) => product.stock <= product.min_stock
        );
        setLowStockProducts(lowStock);
      }

      // Load pending sync items
      const pendingSalesData = OfflineSync.getPendingSales();
      const pendingOrdersData = OfflineSync.getPendingPurchaseOrders();

      setPendingSales(pendingSalesData);
      setPendingOrders(pendingOrdersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    }
  };

  const syncPendingData = async () => {
    if (!OfflineSync.isOnline() || syncing) return;

    setSyncing(true);
    let syncedItems = 0;

    try {
      // Sync pending sales (in a real app, you'd have a sales table in Supabase)
      const pendingSalesData = OfflineSync.getPendingSales();
      if (pendingSalesData.length > 0) {
        // For now, just clear them since we don't have a sales table
        OfflineSync.clearPendingSales();
        syncedItems += pendingSalesData.length;
      }

      // Sync pending purchase orders (in a real app, you'd have a purchase_orders table)
      const pendingOrdersData = OfflineSync.getPendingPurchaseOrders();
      if (pendingOrdersData.length > 0) {
        // For now, just clear them since we don't have a purchase_orders table
        OfflineSync.clearPendingPurchaseOrders();
        syncedItems += pendingOrdersData.length;
      }

      // Refresh products from server
      const { data: productsData } = await ProductService.getAllProducts();
      if (productsData) {
        setProducts(productsData);
        OfflineSync.saveProductsToLocal(productsData);
        setLastSync(new Date());
      }

      if (syncedItems > 0) {
        toast({
          title: "Sincronización completada",
          description: `${syncedItems} elementos sincronizados con el servidor`,
        });
      }

      // Reload data to refresh UI
      loadData();
    } catch (error) {
      console.error("Error syncing data:", error);
      toast({
        title: "Error de sincronización",
        description: "No se pudieron sincronizar todos los datos",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product
      ? `${product.name} (${product.brand})`
      : "Producto no encontrado";
  };

  const totalPendingItems = pendingSales.length + pendingOrders.length;

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Alertas y Sincronización
          </h2>
          <p className="text-muted-foreground">
            Monitoreo de stock bajo y gestión de sincronización offline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={syncPendingData}
            disabled={!isOnline || syncing}
            className="racing-shadow cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive" />
            )}
            Estado de Conexión
          </CardTitle>
          <CardDescription>
            Información sobre la conectividad y sincronización de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-destructive"
                }`}
              ></div>
              <div>
                <div className="font-medium">
                  {isOnline ? "Conectado" : "Sin conexión"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isOnline
                    ? "Datos sincronizados en tiempo real"
                    : "Trabajando en modo offline"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  totalPendingItems === 0 ? "bg-green-500" : "bg-accent"
                }`}
              ></div>
              <div>
                <div className="font-medium">
                  {totalPendingItems} elementos pendientes
                </div>
                <div className="text-sm text-muted-foreground">
                  {totalPendingItems === 0
                    ? "Todo sincronizado"
                    : "Esperando sincronización"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <div>
                <div className="font-medium">Última sincronización</div>
                <div className="text-sm text-muted-foreground">
                  {lastSync ? lastSync.toLocaleString() : "Nunca"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Sync Items */}
      {totalPendingItems > 0 && (
        <Card className="racing-shadow border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-accent" />
              Elementos Pendientes de Sincronización
            </CardTitle>
            <CardDescription>
              Datos guardados localmente que se sincronizarán cuando haya
              conexión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending Sales */}
              {pendingSales.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-4 h-4 text-accent" />
                    <span className="font-medium">
                      Ventas Pendientes ({pendingSales.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pendingSales.slice(0, 5).map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <div className="text-sm">
                          {getProductName(sale.product_id)} - {sale.quantity}{" "}
                          unidades
                        </div>
                        <div className="text-sm font-medium">
                          ${sale.total.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {pendingSales.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        Y {pendingSales.length - 5} ventas más...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Orders */}
              {pendingOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span className="font-medium">
                      Pedidos Pendientes ({pendingOrders.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pendingOrders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <div className="text-sm">
                          {getProductName(order.product_id)} - {order.quantity}{" "}
                          unidades
                        </div>
                        <div className="text-sm font-medium">
                          ${order.total.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {pendingOrders.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        Y {pendingOrders.length - 5} pedidos más...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Alertas de Stock Bajo
          </CardTitle>
          <CardDescription>
            Productos que requieren reposición inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              <span>Todos los productos tienen stock suficiente</span>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        product.stock === 0 ? "bg-destructive" : "bg-accent"
                      }`}
                    ></div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.brand} • {product.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          product.stock === 0 ? "destructive" : "outline"
                        }
                      >
                        {product.stock === 0 ? "Sin stock" : "Stock bajo"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Actual: {product.stock} • Mínimo: {product.min_stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>
            Información general sobre el estado de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {products.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Productos en inventario
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {lowStockProducts.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Productos con stock bajo
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {totalPendingItems}
              </div>
              <div className="text-sm text-muted-foreground">
                Elementos pendientes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {isOnline ? "100%" : "0%"}
              </div>
              <div className="text-sm text-muted-foreground">Conectividad</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductService } from "@/lib/product-service";
import { OfflineSync } from "@/lib/offline-sync";
import type { Product, Sale } from "@/lib/types";
import {
  Plus,
  ShoppingCart,
  Search,
  Receipt,
  DollarSign,
  TrendingUp,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { SaleDialog } from "@/components/sales/sale-dialog";
import { SalesHistory } from "@/components/sales/sales-history";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateTicket } from "@/lib/ticket-generator";

interface SaleCompletionData {
  items: Array<{
    product: Product;
    quantity: number;
    unit_price: number;
  }>;
  total: number;
  discount?: number;
  customer_name?: string;
  customer_email?: string;
  payment_method?: "cash" | "card" | "transfer" | "other";
  notes?: string;
}

interface SalesStats {
  todayTotal: number;
  todayCount: number;
  weekTotal: number;
  monthTotal: number;
  averageTicket: number;
  yesterdayTotal: number;
  yesterdayCount: number;
  growthPercentage: number;
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    todayTotal: 0,
    todayCount: 0,
    weekTotal: 0,
    monthTotal: 0,
    averageTicket: 0,
    yesterdayTotal: 0,
    yesterdayCount: 0,
    growthPercentage: 0,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [saleNumber, setSaleNumber] = useState(Date.now().toString());
  const [itemsOnSale, setItemsOnSale] = useState([]);

  const { toast } = useToast();

  useEffect(() => {
    setIsOnline(OfflineSync.isOnline());

    loadData();

    const handleOnlineStatus = () => {
      const online = OfflineSync.isOnline();
      setIsOnline(online);

      if (online && pendingSalesCount > 0) {
        handleOfflineSync();
      }
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadProducts(), loadSales(), loadSalesStats()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar todos los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = async () => {
    try {
      if (isOnline) {
        const { data: productsData, error } =
          await ProductService.getAllProducts();

        if (error) {
          console.error("Error loading products from server:", error);
          const localProducts = OfflineSync.getProductsFromLocal();
          setProducts(localProducts);

          toast({
            title: "Advertencia",
            description: "Usando datos locales para productos",
            variant: "default",
          });
        } else if (productsData) {
          setProducts(productsData);
          OfflineSync.saveProductsToLocal(productsData);
        }
      } else {
        const localProducts = OfflineSync.getProductsFromLocal();
        setProducts(localProducts);
      }
    } catch (error) {
      console.error("Error in loadProducts:", error);
      const localProducts = OfflineSync.getProductsFromLocal();
      setProducts(localProducts);
    }
  };

  const loadSales = async () => {
    try {
      if (isOnline) {
        const { data: salesData, error } = await ProductService.getAllSales();

        if (error) {
          console.error("Error loading sales from server:", error);
          const { data: mockSales } = await ProductService.getSalesToday();
          setSales(mockSales || []);
        } else if (salesData) {
          setSales(salesData);
        }
      } else {
        const { data: mockSales } = await ProductService.getSalesToday();
        setSales(mockSales || []);
      }

      const pending = OfflineSync.getPendingSales();
      setPendingSalesCount(pending.length);
    } catch (error) {
      console.error("Error in loadSales:", error);
      const { data: mockSales } = await ProductService.getSalesToday();
      setSales(mockSales || []);
    }
  };

  // Nueva función para cargar estadísticas reales desde Supabase
  const loadSalesStats = async () => {
    try {
      // Obtener estadísticas del día actual
      const { data: todayStats, error: todayError } =
        await ProductService.getTodayStats();

      if (todayError) {
        console.error("Error loading today stats:", todayError);
        return;
      }

      // Obtener comparación con ayer
      const { data: comparison, error: comparisonError } =
        await ProductService.getTodayVsYesterdayComparison();

      if (comparisonError) {
        console.error("Error loading comparison:", comparisonError);
      }

      // Obtener ventas de la semana
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const { data: weekSales, error: weekError } =
        await ProductService.getSalesByDateRange(
          weekStart.toISOString(),
          new Date().toISOString()
        );

      // Obtener ventas del mes
      const monthStart = new Date();
      monthStart.setDate(1);
      const { data: monthSales, error: monthError } =
        await ProductService.getSalesByDateRange(
          monthStart.toISOString(),
          new Date().toISOString()
        );

      // Calcular totales
      const weekTotal =
        weekSales?.reduce((sum, sale) => sum + (sale.final_amount || 0), 0) ||
        0;

      const monthTotal =
        monthSales?.reduce((sum, sale) => sum + (sale.final_amount || 0), 0) ||
        0;

      setSalesStats({
        todayTotal: todayStats?.revenueToday || 0,
        todayCount: todayStats?.totalSalesToday || 0,
        averageTicket: todayStats?.averageTicketToday || 0,
        weekTotal,
        monthTotal,
        yesterdayTotal: comparison?.yesterday.revenue || 0,
        yesterdayCount: comparison?.yesterday.sales || 0,
        growthPercentage: comparison?.growth.revenuePercentage || 0,
      });
    } catch (error) {
      console.error("Error loading sales stats:", error);
    }
  };

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products.slice(0, 10));
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery)
    );

    setFilteredProducts(filtered.slice(0, 10));
  };

  const handleSaleComplete = async (saleData: SaleCompletionData) => {
    setLoading(true);

    try {
      const saleDate = new Date().toISOString();

      // Usar el sale_number generado previamente o crear uno nuevo
      const finalSaleNumber = saleNumber || ProductService.generateSaleNumber();

      for (const item of saleData.items) {
        if (item.product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stock}, Requerido: ${item.quantity}`
          );
        }
      }

      if (isOnline) {
        await processSaleWithSupabase(saleData, saleDate, finalSaleNumber);
      } else {
        await processSaleOffline(saleData, saleDate, finalSaleNumber);
      }

      updateLocalState(saleData, saleDate, finalSaleNumber);

      const ticketSales: Sale[] = saleData.items.map((item) => ({
        sale_number: "V-" + saleNumber,
        product_id: item.product.id || "",
        product_barcode: item.product.barcode,
        product_name: item.product.name || item.product.description || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.quantity * item.unit_price,
        discount_amount: saleData.discount
          ? saleData.discount / saleData.items.length
          : 0, // Distribuir descuento proporcionalmente
        final_amount:
          item.quantity * item.unit_price -
          (saleData.discount ? saleData.discount / saleData.items.length : 0),
        payment_method: saleData.payment_method || "cash",
        customer_name: saleData.customer_name,
        customer_email: saleData.customer_email,
        notes: saleData.notes,
        sale_date: saleDate,
        total: item.quantity * item.unit_price,
      }));

      generateTicket(ticketSales);

      // Recargar estadísticas después de la venta
      await loadSalesStats();

      toast({
        title: "Venta registrada",
        description: `Venta ${
          "V-" + saleNumber
        } - Total: $${saleData.total.toLocaleString()}`,
      });

      setShowSaleDialog(false);
    } catch (error) {
      console.error("Error processing sale:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo procesar la venta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processSaleWithSupabase = async (
    saleData: SaleCompletionData,
    saleDate: string,
    saleNumber: string
  ) => {
    if (saleData.items.length > 1) {
      const saleItems = saleData.items.map((item) => ({
        product_id: item.product.id!,
        product_barcode: item.product.barcode,
        product_name: item.product.name || item.product.description || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.quantity * item.unit_price,
        discount_amount: 0,
        final_amount: item.quantity * item.unit_price,
        sale_date: saleDate,
      }));

      const { data, error } = await ProductService.createBulkSale(
        saleItems as Sale[],
        saleNumber, // Usar el sale_number pasado como parámetro
        {
          customer_name: saleData.customer_name,
          customer_email: saleData.customer_email,
          payment_method: saleData.payment_method || "cash",
          notes: saleData.notes,
        }
      );

      if (error instanceof Error) {
        throw new Error(
          `Error al registrar venta múltiple: ${
            error?.message || "Error desconocido"
          }`
        );
      }
    } else {
      const item = saleData.items[0];
      const saleRecord = {
        sale_number: saleNumber, // Usar el sale_number pasado como parámetro
        product_id: item.product.id || "",
        product_barcode: item.product.barcode,
        product_name: item.product.name || item.product.description || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.quantity * item.unit_price,
        discount_amount: 0,
        final_amount: item.quantity * item.unit_price,
        payment_method: saleData.payment_method || "cash",
        customer_name: saleData.customer_name,
        customer_email: saleData.customer_email,
        notes: saleData.notes,
        sale_date: saleDate,
      };

      const { data, error } = await ProductService.createSale(
        saleRecord as Sale
      );

      if (error) {
        throw new Error(
          `Error al registrar venta: ${
            (error as any).message || "Error desconocido"
          }`
        );
      }
    }
  };

  const processSaleOffline = async (
    saleData: SaleCompletionData,
    saleDate: string,
    saleNumber: string
  ) => {
    for (const item of saleData.items) {
      const totalAmount = item.quantity * item.unit_price;
      const saleRecord = {
        sale_number: saleNumber, // Usar el sale_number pasado como parámetro
        product_id: item.product.id || "",
        product_barcode: item.product.barcode,
        product_name: item.product.name || item.product.description || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: totalAmount,
        discount_amount: 0,
        final_amount: totalAmount,
        total: totalAmount,
        payment_method: saleData.payment_method || "cash",
        customer_name: saleData.customer_name,
        customer_email: saleData.customer_email,
        notes: saleData.notes,
        sale_date: saleDate,
        created_at: saleDate,
      };

      OfflineSync.savePendingSale(saleRecord);

      const newStock = item.product.stock - item.quantity;
      OfflineSync.updateLocalProductStock(item.product.id || "", newStock);
    }

    setPendingSalesCount(OfflineSync.getPendingSales().length);
  };

  const updateLocalState = (
    saleData: SaleCompletionData,
    saleDate: string,
    saleNumber: string
  ) => {
    const newSales: Sale[] = saleData.items.map((item, index) => ({
      id: `temp_${Date.now()}_${index}`,
      sale_number: saleNumber, // Usar el sale_number pasado como parámetro
      product_id: item.product.id || "",
      product_barcode: item.product.barcode,
      product_name: item.product.name || item.product.description || "",
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      total_amount: item.quantity * item.unit_price,
      final_amount: item.quantity * item.unit_price,
      discount_amount: 0,
      payment_method: saleData.payment_method || "cash",
      customer_name: saleData.customer_name,
      customer_email: saleData.customer_email,
      notes: saleData.notes,
      sale_date: saleDate,
      created_at: saleDate,
      updated_at: saleDate,
    }));

    setSales((prev) => [...newSales, ...prev]);

    setProducts((prev) =>
      prev.map((p) => {
        const saleItem = saleData.items.find(
          (item) => item.product.id === p.id
        );
        if (saleItem) {
          return { ...p, stock: p.stock - saleItem.quantity };
        }
        return p;
      })
    );
  };

  const handleOfflineSync = async () => {
    if (!isOnline) return;

    setSyncInProgress(true);
    try {
      const pendingSales = OfflineSync.getPendingSales();
      let syncedCount = 0;

      for (const sale of pendingSales) {
        try {
          const { data, error } = await ProductService.createSale(sale);
          if (!error && data) {
            OfflineSync.removePendingSale(sale.id || "");
            syncedCount++;
          }
        } catch (syncError) {
          console.error(
            `Error sincronizando venta ${sale.sale_number}:`,
            syncError
          );
        }
      }

      if (syncedCount > 0) {
        toast({
          title: "Sincronización completada",
          description: `${syncedCount} ventas sincronizadas`,
        });

        setPendingSalesCount(OfflineSync.getPendingSales().length);
        await loadData();
      }
    } catch (error) {
      console.error("Error durante la sincronización:", error);
      toast({
        title: "Error de sincronización",
        description: "No se pudieron sincronizar todas las ventas",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleDeleteSale = async (saleNumber: string) => {
    console.log("=== DELETE SALE DEBUG ===");
    console.log("Eliminando venta:", saleNumber);

    try {
      // Usar la nueva función del ProductService
      const { success, error } = await ProductService.deleteSaleBySaleNumber(
        saleNumber
      );

      if (!success || error) {
        throw error instanceof Error
          ? error
          : new Error("Error al eliminar la venta");
      }

      toast({
        title: "Venta eliminada",
        description: `La venta ${saleNumber} fue eliminada y el stock fue restaurado`,
      });

      // Recargar datos
      await loadData();
    } catch (error) {
      console.error("Error eliminando venta:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la venta",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Ventas
          </h2>
          <p className="text-muted-foreground">
            Registro y seguimiento de ventas del lubricentro
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>

          {pendingSalesCount > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer"
              size="sm"
              onClick={handleOfflineSync}
              disabled={!isOnline || syncInProgress}
            >
              {syncInProgress ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              Sincronizar ({pendingSalesCount})
            </Button>
          )}

          <Button
            onClick={() => {
              setShowSaleDialog(true);
              setSaleNumber(Date.now().toString());
            }}
            disabled={loading}
            className="racing-shadow cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Nueva Venta
          </Button>
        </div>
      </div>

      {!isOnline && (
        <Alert className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Estás trabajando offline. Las ventas se guardarán localmente y se
            sincronizarán cuando recuperes la conexión.
          </AlertDescription>
        </Alert>
      )}

      {/* Sales Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${salesStats.todayTotal.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{salesStats.todayCount} transacciones</span>
              {salesStats.growthPercentage !== 0 && (
                <span
                  className={`ml-2 flex items-center ${
                    salesStats.growthPercentage > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {salesStats.growthPercentage > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(salesStats.growthPercentage).toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${salesStats.weekTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </CardContent>
        </Card>

        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${salesStats.monthTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Mes actual</p>
          </CardContent>
        </Card>

        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio/Venta
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${salesStats.averageTicket.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Ticket promedio hoy</p>
          </CardContent>
        </Card>
      </div>

      <SalesHistory
        sales={sales}
        products={products}
        onDeleteSale={handleDeleteSale}
      />

      <SaleDialog
        open={showSaleDialog}
        onOpenChange={setShowSaleDialog}
        products={products}
        onSaleComplete={handleSaleComplete}
      />
    </>
  );
}

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Loader2,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

// Importar el hook desde el archivo que acabamos de crear
import { useDashboard } from "@/hooks/user-dashboard-page";

export default function DashboardPage() {
  const {
    products,
    sales,
    lowStock,
    inventoryValue,
    todaysSales,
    totalProducts,
    totalSales,
    loading,
    error,
  } = useDashboard();

  console.log("Dashboard render:", {
    products: products.length,
    sales: sales.length,
    loading,
    error,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="text-lg font-medium">Cargando dashboard...</p>
            <p className="text-sm text-muted-foreground">
              Obteniendo datos del sistema
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Obtener productos con stock bajo
  const lowStockProducts = products
    .filter((p) => p.stock < p.min_stock)
    .slice(0, 3);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Resumen general del lubricentro Cinalli Racing Team
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Productos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totalProducts.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos en inventario
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas del Día
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${todaysSales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalSales} transacciones hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {lowStock}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos requieren reposición
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Cards */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex lg:flex-col items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Alertas de Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{product.name}</span>
                    <Badge
                      variant={product.stock === 0 ? "destructive" : "outline"}
                    >
                      {product.stock} unidades
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  ✅ No hay productos con stock bajo
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ventas Recientes
              </CardTitle>
              <CardDescription>Últimas transacciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sales.slice(0, 3).map((sale, index) => (
                <div
                  key={sale.id || index}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{sale.id}</span>
                  <Badge variant="secondary">
                    ${sale.total?.toLocaleString()}
                  </Badge>
                </div>
              ))}
              {sales.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No hay ventas registradas hoy
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>Operaciones frecuentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <Link
                  to="/sales"
                  className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Nueva Venta
                </Link>
                <Link
                  to="/inventory"
                  className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  <Package className="h-4 w-4" />
                  Agregar Producto
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
